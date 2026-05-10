import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector

CONNECTION_STRING = os.getenv("DATABASE_URL")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")


def train_mindmesh_with_document(file_path):
    print(f"🧠 Entraînement de MindMesh avec : {file_path}")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)
    
    PGVector.from_documents(
        embedding=embeddings,
        documents=docs,
        collection_name="mindmesh_knowledge",
        connection_string=CONNECTION_STRING,
        pre_delete_collection=False
    )
    print("✅ Connaissance intégrée avec succès !")


if __name__ == "__main__":
    print("⚠️ Modifie le chemin du fichier PDF avant de lancer le script.")
    # train_mindmesh_with_document("chemin/vers/ton/document.pdf")
